import { useState, useRef, useCallback } from 'react';

interface CameraState {
  isActive: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    error: null,
    stream: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const constraints = {
        video: {
          facingMode: 'user', // Front camera for selfies
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState({
        isActive: true,
        error: null,
        stream,
      });
    } catch (error) {
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }

      setState({
        isActive: false,
        error: errorMessage,
        stream: null,
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState({
      isActive: false,
      error: null,
      stream: null,
    });
  }, [state.stream]);

  const capturePhoto = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !state.isActive) {
        reject(new Error('Camera is not active'));
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture photo'));
          }
        },
        'image/jpeg',
        0.8 // Quality setting
      );
    });
  }, [state.isActive]);

  const switchCamera = useCallback(async () => {
    if (!state.isActive) return;

    try {
      // Stop current stream
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }

      // Get the current facing mode
      const currentTrack = state.stream?.getVideoTracks()[0];
      const settings = currentTrack?.getSettings();
      const currentFacingMode = settings?.facingMode;

      // Switch to opposite camera
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      const constraints = {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setState(prev => ({
        ...prev,
        stream: newStream,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to switch camera',
      }));
    }
  }, [state.stream, state.isActive]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  };
};