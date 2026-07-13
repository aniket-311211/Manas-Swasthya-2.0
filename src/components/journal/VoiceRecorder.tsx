import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Trash2, Download } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
  existingRecording?: string;
  onDeleteRecording?: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  existingRecording,
  onDeleteRecording,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    existingRecording || null
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (existingRecording) {
      setAudioUrl(existingRecording);
    }
  }, [existingRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(url);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
      if (onDeleteRecording) {
        onDeleteRecording();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadRecording = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `voice-note-${new Date().toISOString().split("T")[0]}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Mic className="w-4 h-4 mr-2" />
          Voice Note
        </h4>

        {audioUrl && (
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadRecording}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download recording"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={deleteRecording}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!audioUrl ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          ) : (
            <button
              onClick={playRecording}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center">
            <div className="text-red-500 font-mono text-lg">
              {formatTime(recordingTime)}
            </div>
            <div className="text-xs text-gray-500">Recording...</div>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="text-center">
            <div className="text-green-600 text-sm font-medium">
              Voice note ready
            </div>
            <div className="text-xs text-gray-500">Click play to listen</div>
          </div>
        )}

        {!audioUrl && !isRecording && (
          <div className="text-center text-xs text-gray-500">
            Click the microphone to start recording
          </div>
        )}
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};

export default VoiceRecorder;
