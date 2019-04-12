(() => {
  const setCanvasHeightAndWidth = () => {
    const screenWidth = screen.width;
    const totalPadding = 16; // double signature-pad-wrapper width
    const targetWidth = screenWidth - totalPadding;
    const ratioMultiplier = targetWidth / endSignWidth;
    signPadCanvas.style.width = targetWidth + "px";
    signPadCanvas.style.height = (endSignHeight * ratioMultiplier) + "px";
  };

  const resizeCanvasForHighDPI = canvas => {
    let ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
  };

  const initCanvas = (canvas, context) => {
    context.lineWidth = 4;
    context.lineJoin = signPadContext.lineCap = 'round';
    context.fillStyle = "rgb(255, 255, 255)";
    context.fillRect(0, 0, signPadCanvas.width, signPadCanvas.height);
    context.fillStyle = "rgb(0, 0, 0)";
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mouseup', onMouseUpTouchEnd, false);
    canvas.addEventListener('touchstart', onTouchStart, false);
    canvas.addEventListener('touchmove', onTouchMove, false);
    canvas.addEventListener('touchend', onMouseUpTouchEnd, false);
  };

  const onMouseDown = e => {
    e.preventDefault();
    isDrawing = true;
    drawDot(e.clientX - left, e.clientY - top);
    points.push({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = e => {
    e.preventDefault();
    if (!isDrawing) return;
    points.push({ x: e.clientX, y: e.clientY });
    drawBezierCurve();
  };

  const onTouchStart = e => {
    e.preventDefault();
    isDrawing = true;
    drawDot(e.touches[0].clientX - left, e.touches[0].clientY - top);
    points.push({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const onTouchMove = e => {
    e.preventDefault();
    if (!isDrawing) return;
    points.push({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    drawBezierCurve();
  };

  const onMouseUpTouchEnd = () => {
    isDrawing = false;
    points.length = 0;
  };

  const drawDot = (x, y) => {
    const yOffset = window.pageYOffset;
    signPadContext.beginPath();
    signPadContext.arc(x, y + yOffset, 2, 0, 2 * Math.PI, true);
    signPadContext.fill();
  };

  const drawBezierCurve = () => {
    // TODO: the next statement is commented to allow multiple stokes however,
    //       this has made the signature not draw curves as smoothly
    // signPadContext.clearRect(0, 0, signPadContext.canvas.width, signPadContext,canvas.height);
    let p1 = points[0];
    let p2 = points[1];
    signPadContext.beginPath();
    const yOffset = window.pageYOffset;
    signPadContext.moveTo(p1.x - left, p1.y - top + yOffset);
    for (let i = 1, len = points.length; i < len; i++) {
      const midPoint = getMidPoint(p1, p2);
      const cpx = p1.x - left;
      const cpy = p1.y - top + yOffset;
      const x = midPoint.x - left;
      const y = midPoint.y - top + yOffset;
      signPadContext.quadraticCurveTo(cpx, cpy, x, y);
      p1 = points[i];
      p2 = points[i + 1];
    }
    signPadContext.lineTo(p1.x - left, p1.y - top + yOffset);
    signPadContext.stroke();
  };

  const getMidPoint = (p1, p2) => ({
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  });

  const clearSignPad = () => {
    initCanvas(signPadCanvas, signPadContext);
  };

  const saveAsJPG = () => {
    if (isCanvasBlank()) {
      alert('Empty signature');
    } else {
      const img = new Image();
      img.src = signPadCanvas.toDataURL('image/jpeg');
      const imgCanvas = createBlankCanvas(endSignWidth, endSignHeight, false);
      const imgContext = imgCanvas.getContext('2d');
      img.onload = () => {
        imgContext.drawImage(img, 0, 0, endSignWidth, endSignHeight);
        downloadSignatureImage(imgCanvas.toDataURL(), "signature.jpg");
      };
    }
  };

  const isCanvasBlank = () => {
    const whiteCanvas = createBlankCanvas(signPadCanvas.width, signPadCanvas.height, true);
    return signPadCanvas.toDataURL() === whiteCanvas.toDataURL();
  };

  const createBlankCanvas = (w, h, isWithWhiteBg) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    if (isWithWhiteBg) {
      const context = canvas.getContext('2d');
      context.fillStyle = "rgb(255, 255, 255)";
      context.fillRect(0, 0, w, h);
    }
    return canvas;
  };

  const downloadSignatureImage = (dataUrl, imageFilename) => {
    const url = window.URL.createObjectURL(dataURLToBlob(dataUrl));
    const a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = imageFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const dataURLToBlob = dataURL => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  // force window to top onload to prevent incorrect drawing coords
  window.onbeforeunload = function() {
    window.scrollTo(0, 0);
  };

  const endSignWidth = 1024;
  const endSignHeight = 768;
  const signPadCanvas = document.getElementById('signature-pad');
  setCanvasHeightAndWidth();
  resizeCanvasForHighDPI(signPadCanvas);
  const signPadContext = signPadCanvas.getContext('2d');
  initCanvas(signPadCanvas, signPadContext);
  const left = signPadCanvas.getBoundingClientRect().left;
  const top = signPadCanvas.getBoundingClientRect().top;

  let isDrawing;
  let points = [];

  const buttonClearSignPad = document.querySelector("[data-action=clear]");
  const buttonSaveAsJPG = document.querySelector("[data-action=save-jpg]");
  buttonClearSignPad.addEventListener("click", clearSignPad, false);
  buttonSaveAsJPG.addEventListener("click", saveAsJPG, false);
})();
