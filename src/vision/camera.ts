export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("这个浏览器不支持摄像头（需要 https 或 localhost）");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 },
    },
  });
  video.srcObject = stream;
  await video.play();
  if (!video.videoWidth) {
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });
  }
  return stream;
}
