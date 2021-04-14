const puppy = require("puppeteer");
const fs = require("fs");

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

    await tab.goto(url + "/Videos?sort=p");
    let videosCount = await tab.$$("a#thumbnail[href]");
    let videosUrl = [];
    for (let i = 0; i < 10; i++) {
        let videoUrl = "https://www.youtube.com";
        videoUrl += await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, videosCount[i]);  

        videosUrl.push(videoUrl);
    }
    videoDetail(videosUrl, tab);
}

async function videoDetail(urls, tab) {
    let videoDetails = [];
    for (let i = 0; i < urls.length; i++) {
        await tab.goto(urls[i]);
        
        await tab.waitForSelector(".view-count.style-scope.ytd-video-view-count-renderer", { visible: true });
        let vidViewsCount = await tab.$(".view-count.style-scope.ytd-video-view-count-renderer");
        let vidViews = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, vidViewsCount);

        let title = await tab.$("yt-formatted-string.style-scope.ytd-video-primary-info-renderer:nth-child(1)");
        let vidTitle = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, title);

        let likeDislike = await tab.$$(".yt-simple-endpoint.style-scope.ytd-toggle-button-renderer > #text");
        let likes = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, likeDislike[0]);

        let vidInfo = {
            'vidId': i,
            'vidTitle' : vidTitle,
            'vidViews': vidViews,
            'vidLikes': likes,
            'vidURL': urls[i]
        };

        videoDetails.push(vidInfo);
    }
    
    channelData['VideoDetails'] = videoDetails;

    fs.writeFileSync("channelData.json", JSON.stringify(channelData));

    await tab.close();
}


main();