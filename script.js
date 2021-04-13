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

    channelDetails("https://www.youtube.com/" + channelUrl, tab, browser);
}

async function channelDetails(url, tab, browser) {
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
    await tab.waitForSelector("a#thumbnail[href]", { visible: true });
    let videosCount = await tab.$$("a#thumbnail[href]");
    console.log(videosCount.length);
    for (let i = 0; i < videosCount.length; i++) {
        let videoUrl = "https://www.youtube.com";
        videoUrl += await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, videosCount[i]);

        videoDetail(videoUrl, tab);
        // await new Promise(function (resolve, reject) {
        //     setTimeout(resolve, 1000);
        // })
    }
    // await tab.close();
}

async function videoDetail(url, tab) {
    // let tab2 = await browser.newPage();
    await tab.goto(url);
    await tab.waitForNavigation({ waitUntil: "networkidle0" });
    await tab.waitForSelector(".yt-simple-endpoint.style-scope.ytd-toggle-button-renderer > #text", { visible: true });
    let likeDislike = await tab.$$(".yt-simple-endpoint.style-scope.ytd-toggle-button-renderer > #text");
    console.log(likeDislike.length);
}

main();