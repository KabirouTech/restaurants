"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, Trash2 } from "lucide-react";
import { uploadComplaintFileAction } from "@/actions/complaints";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AudioRecorderProps {
    onAudioUrl: (url: string | null) => void;
    audioUrl: string | null;
}

const MAX_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export function AudioRecorder({ onAudioUrl, audioUrl }: AudioRecorderProps) {
    const t = useTranslations("dashboard.support");
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        };
    }, [stopTimer]);

    const uploadAudio = async (blob: Blob, fileName: string, contentType: string) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", new File([blob], fileName, { type: contentType }));

            const result = await uploadComplaintFileAction(formData);
            if (result.error) throw new Error(result.error);

            onAudioUrl(result.url!);
        } catch (err: any) {
            console.error("Audio upload error:", err);
            toast.error(t("submitError"));
        } finally {
            setUploading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                stopTimer();
                setRecording(false);
                setElapsed(0);

                if (chunksRef.current.length > 0) {
                    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                    uploadAudio(blob, `recording_${Date.now()}.webm`, "audio/webm");
                }
            };

            mediaRecorder.start();
            setRecording(true);

            const start = Date.now();
            timerRef.current = setInterval(() => {
                const diff = Date.now() - start;
                setElapsed(diff);
                if (diff >= MAX_DURATION_MS) {
                    mediaRecorder.stop();
                }
            }, 500);
        } catch {
            toast.error("Impossible d'accéder au microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("audio/")) {
            toast.error("Veuillez sélectionner un fichier audio.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Fichier trop volumineux (max 10MB).");
            return;
        }
        await uploadAudio(file, file.name, file.type);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAudio = () => {
        onAudioUrl(null);
    };

    const formatTime = (ms: number) => {
        const secs = Math.floor(ms / 1000);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (audioUrl) {
        return (
            <div className="flex items-center gap-2">
                <audio src={audioUrl} controls className="h-8 flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={removeAudio}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {recording ? (
                <>
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                        <Square className="h-3 w-3 mr-1" />
                        {t("stopRecording")}
                    </Button>
                    <span className="text-sm text-red-500 font-mono animate-pulse">
                        {formatTime(elapsed)} / 2:00
                    </span>
                </>
            ) : (
                <>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startRecording}
                        disabled={uploading}
                    >
                        <Mic className="h-3 w-3 mr-1" />
                        {t("recordAudio")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="h-3 w-3 mr-1" />
                        {t("uploadAudio")}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileImport}
                        className="hidden"
                    />
                </>
            )}
            {uploading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                    Upload...
                </span>
            )}
            <span className="text-xs text-muted-foreground">{t("maxDuration")}</span>
        </div>
    );
}
