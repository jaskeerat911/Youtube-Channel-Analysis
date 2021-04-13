const puppy = require("puppeteer");

let channelName = process.argv[2];

let channelData = {};

async function main() {
    let browser = await puppy.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"]
    });
    let tabs = await browser.pages();
    let tab = tabs[0];
    await tab.goto("https://www.youtube.com/");
    await tab.type("#search", channelName);
    await tab.click("#search-icon-legacy");
    await tab.waitForSelector("#avatar-section > a", { visible: true });
    let channel = await tab.$("#avatar-section > a");
    let channelUrl = await tab.evaluate(function (ele) {
        return ele.getAttribute('href');
    }, channel);
    
    channelDetails("https://www.youtube.com/" + channelUrl, tab);
}

async function channelDetails(url, tab) {
    await tab.goto(url);
    await tab.waitForSelector("div#meta > #channel-name > div > div> #text");
    let channelTitle = await tab.$("div#meta > #channel-name > div > div> #text");
    channelData['ChannelName'] = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, channelTitle);
    
    let subscriberCount = await tab.$("div#meta > #subscriber-count");
    channelData['Subscribers'] = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, subscriberCount);

    await tab.goto(url + "/About");
    let viewsCount = await tab.$("#right-column > yt-formatted-string:nth-child(3)");
    channelData['TotalViews'] = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, viewsCount);
    
    await tab.goto(url + "/Videos");
    await tab.waitForSelector("#items > ytd-continuation-item-renderer", { visible: true });
    let videosCount = await tab.$$("#items > ytd-grid-video-renderer");
    
    for (let i = 0; i < videosCount.length; i++){
        let video = await tab.$$("#thumbnail");
        let videoUrl = "https://www.youtube.com/";
        videoUrl += await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        })
        console.log(videoUrl);
    }

    // console.log(channelData);

    // await tab.close();
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 2000;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

main();