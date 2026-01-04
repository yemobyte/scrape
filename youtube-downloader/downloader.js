const fs = require('fs');
const fsPromises = require('fs').promises;
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const os = require('os');
let youtubedl;

try {
    youtubedl = require('youtube-dl-exec');
} catch (err) {
    console.log('youtube-dl-exec not found. YouTube download feature is disabled.');
}

const tempDir = os.tmpdir();

const QUALITY_MAP = {
    1: '160',   // 144p
    2: '134',   // 360p
    3: '135',   // 480p
    4: '136',   // 720p
    5: '137',   // 1080p
    6: '264',   // 1440p
    7: '266',   // 2160p
    8: 'bestaudio',
    9: 'bitrateList'
};

async function youtubeDownloader(link, qualityIndex) {
    if (!youtubedl) {
        return {
            status: false,
            message: `youtube-dl-exec not found, can't download video`,
        };
    }
    try {
        let quality = QUALITY_MAP[qualityIndex] || QUALITY_MAP[2];

        /* Ensure we match the quality exactly or fallback */
        /* youtube-dl format selection is complex. We try to be specific. */
        /* For audio only: */
        if (quality === 'bestaudio') {
            // Logic handled below
        }

        const info = await youtubedl(link, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        const videoDetails = info;
        const thumb = info.thumbnail;

        const tempInfoFile = path.join(tempDir, `info_${Date.now()}.json`);
        await fsPromises.writeFile(tempInfoFile, JSON.stringify(info));

        let result;
        if (quality === 'bitrateList') {
            result = getBitrateList(info);
        } else if (qualityIndex > 7 || quality === 'bestaudio') {
            /* 8 is bestaudio */
            result = await downloadAudioOnly(tempInfoFile, quality, videoDetails, thumb);
        } else {
            result = await downloadVideoWithAudio(tempInfoFile, quality, videoDetails, thumb);
        }

        await fsPromises.unlink(tempInfoFile).catch(() => { });

        return result;

    } catch (err) {
        console.error('Youtube Downloader Error:\n', err);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: err.message,
        };
    }
}

function getBitrateList(info) {
    const bitrateList = (info.formats || [])
        .filter(element => element.acodec !== 'none' && element.vcodec === 'none')
        .map(element => ({
            codec: element.acodec,
            bitrate: element.abr,
            format_id: element.format_id
        }))
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        creator: '@ShiroNexo',
        status: true,
        data: { bitrateList }
    };
}

async function downloadAudioOnly(infoFile, quality, videoDetails, thumb) {
    const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

    console.log('Downloading audio...');
    await youtubedl.exec(videoDetails.webpage_url, {
        loadInfoJson: infoFile,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0',
        output: tempMp3
    });
    console.log('Audio download complete.');

    const mp3Buffer = await fsPromises.readFile(tempMp3);
    await fsPromises.unlink(tempMp3).catch(() => { });

    return createResponse(videoDetails, mp3Buffer, quality, thumb, 'mp3');
}

async function downloadVideoWithAudio(infoFile, quality, videoDetails, thumb) {
    const baseName = `temp_video_${Date.now()}`;
    const videoOutput = path.join(tempDir, `${baseName}.fvideo.mp4`);
    const audioOutput = path.join(tempDir, `${baseName}.faudio.m4a`);
    const finalOutput = path.join(tempDir, `${baseName}.mp4`);

    try {
        console.log('Downloading video stream...');
        /* We force the format ID provided by quality map */
        await youtubedl.exec(videoDetails.webpage_url, {
            loadInfoJson: infoFile,
            format: quality, // e.g. '137' for 1080p
            output: videoOutput
        });

        console.log('Downloading audio stream...');
        await youtubedl.exec(videoDetails.webpage_url, {
            loadInfoJson: infoFile,
            format: 'bestaudio',
            output: audioOutput
        });

        console.log('Merging video & audio...');
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-y', // Force overwrite
                '-i', videoOutput,
                '-i', audioOutput,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-strict', 'experimental',
                finalOutput
            ]);

            ffmpeg.stderr.on('data', (d) => process.stdout.write(d.toString()));

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('Merge complete.');
                    resolve();
                } else {
                    reject(new Error(`ffmpeg exited with code ${code}`));
                }
            });
        });

        const mp4Buffer = await fsPromises.readFile(finalOutput);

        await fsPromises.unlink(videoOutput).catch(() => { });
        await fsPromises.unlink(audioOutput).catch(() => { });
        await fsPromises.unlink(finalOutput).catch(() => { });

        return createResponse(videoDetails, mp4Buffer, quality, thumb, 'mp4');

    } catch (err) {
        console.error('Error in downloading or merging:', err);
        throw err;
    }
}


function createResponse(videoDetails, buffer, quality, thumb, type) {
    return {
        creator: '@ShiroNexo',
        status: true,
        data: {
            title: videoDetails.title,
            result: buffer, // This is the binary buffer
            size: buffer.length,
            quality,
            desc: videoDetails.description,
            views: videoDetails.view_count,
            likes: videoDetails.like_count,
            channel: videoDetails.uploader,
            uploadDate: videoDetails.upload_date,
            thumb,
            type
        },
    };
}

module.exports = {
    youtubeDownloader
};
