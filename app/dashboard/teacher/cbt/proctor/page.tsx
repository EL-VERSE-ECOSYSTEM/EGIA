'use client'

import React, { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, VideoOff, Camera, AlertTriangle, ShieldCheck, RefreshCw, Circle } from 'lucide-react'

export default function ProctorPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [snapshots, setSnapshots] = useState<string[]>([])
  const [warningCount, setWarningCount] = useState(0)
  const [log, setLog] = useState<{ timestamp: string; event: string }[]>([])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      // Start recording
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' })
      recordedChunksRef.current = []

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)

      addLog('Webcam proctoring feed started.')
    } catch (err) {
      console.error('Error accessing webcam:', err)
      addLog('Failed to access webcam feed. Permission denied or no camera found.')
    }
  }

  const stopWebcam = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setStream(null)
    setIsRecording(false)
    addLog('Webcam proctoring feed stopped.')
  }

  const captureSnapshot = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setSnapshots(prev => [dataUrl, ...prev.slice(0, 5)])
      addLog('Captured proctoring snapshot for facial verification.')
    }
  }

  const addWarning = () => {
    setWarningCount(prev => prev + 1)
    addLog(`PROCTOR WARNING TRIGGERED (#${warningCount + 1}): Suspicious activity logged.`)
  }

  const addLog = (event: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [{ timestamp, event }, ...prev])
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI CBT Webcam Proctoring Monitor</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Real-time live video recording, facial verification snapshots, and automated violation logs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* WEBCAM FEED CONTAINER */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-950 text-white overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black">Live Proctor Feed</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {isRecording ? 'Actively recording HD proctor video stream' : 'Webcam stream inactive'}
                    </CardDescription>
                  </div>
                </div>

                <Badge className={`font-black text-[10px] uppercase px-3 py-1 border-none ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Circle className="w-2 h-2 fill-current inline mr-1" />
                  {isRecording ? 'LIVE REC' : 'OFFLINE'}
                </Badge>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {!isRecording && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950/80 text-slate-400">
                      <VideoOff className="w-12 h-12" />
                      <p className="text-xs font-bold">Click "Start Proctor Stream" below to initialize video capture</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button
                        onClick={startWebcam}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl"
                      >
                        <Video className="w-4 h-4 mr-2" /> Start Proctor Stream
                      </Button>
                    ) : (
                      <Button
                        onClick={stopWebcam}
                        className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-6 py-3 rounded-xl"
                      >
                        <VideoOff className="w-4 h-4 mr-2" /> Stop Stream
                      </Button>
                    )}

                    <Button
                      onClick={captureSnapshot}
                      disabled={!isRecording}
                      variant="outline"
                      className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-xl disabled:opacity-40"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Capture Snapshot
                    </Button>
                  </div>

                  <Button
                    onClick={addWarning}
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-xs px-4 py-3 rounded-xl"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Trigger Warning
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SNAPSHOTS GALLERY */}
            {snapshots.length > 0 && (
              <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 space-y-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" /> Facial Verification Snapshots
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {snapshots.map((src, i) => (
                    <img key={i} src={src} alt="Snapshot" className="rounded-xl border border-slate-200 aspect-video object-cover shadow-sm" />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT METRICS & LOGS */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Session Violations</h3>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-amber-900">{warningCount}</p>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Warning Count</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Real-time Event Audit Log</h3>
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {log.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No events recorded yet.</p>
                ) : (
                  log.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5">
                      <p className="font-mono text-[10px] text-slate-400 font-bold">{item.timestamp}</p>
                      <p className="font-bold text-slate-800 leading-snug">{item.event}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
