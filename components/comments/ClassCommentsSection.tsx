'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Reply, Trash2, User, Loader2, CornerDownRight } from 'lucide-react'
import { getClassComments, postClassComment, deleteClassComment } from '@/app/actions/comments'
import { toast } from 'sonner'

interface ClassCommentsSectionProps {
  resourceType: string
  resourceId: string
  title?: string
  currentUserId?: string
  currentUserRole?: string
  isDarkTheme?: boolean
}

export function ClassCommentsSection({
  resourceType,
  resourceId,
  title = 'Discussion & Comments',
  currentUserId,
  currentUserRole,
  isDarkTheme = false,
}: ClassCommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadComments = async () => {
    if (!resourceId) return
    try {
      const data = await getClassComments(resourceType, resourceId)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadComments()
  }, [resourceType, resourceId])

  const handlePostComment = async (parentId?: string) => {
    const text = parentId ? replyContent : newComment
    if (!text.trim()) {
      return toast.error('Please write a comment first.')
    }

    setSubmitting(true)
    try {
      await postClassComment({
        resourceType,
        resourceId,
        content: text,
        parentId,
      })
      toast.success(parentId ? 'Reply posted successfully!' : 'Comment posted!')
      if (parentId) {
        setReplyToId(null)
        setReplyContent('')
      } else {
        setNewComment('')
      }
      await loadComments()
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    setDeletingId(id)
    try {
      await deleteClassComment(id)
      toast.success('Comment deleted.')
      await loadComments()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment.')
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const r = (role || '').toUpperCase()
    switch (r) {
      case 'SUPER_ADMIN':
      case 'SCHOOL_ADMIN':
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' }
      case 'TEACHER':
        return { label: 'Teacher', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' }
      case 'PARENT':
        return { label: 'Parent', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' }
      case 'STUDENT':
      case 'PUPIL':
        return { label: 'Learner', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' }
      default:
        return { label: role, color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' }
    }
  }

  const formatTimeAgo = (dateInput: any) => {
    if (!dateInput) return 'Just now'
    const date = new Date(dateInput)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const topLevelComments = comments.filter((c) => !c.parentId)
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId)

  const cardBgClass = isDarkTheme
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-100 shadow-xl text-slate-900'

  return (
    <Card className={`rounded-3xl border ${cardBgClass} overflow-hidden mt-6`}>
      <CardHeader className="p-6 pb-4 border-b border-slate-800/10 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0" />
          <span>{title}</span>
          <Badge className="ml-2 bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-xs font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* New Comment Input Box */}
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-500 font-bold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              placeholder="Join the discussion... Share thoughts or ask a question about this session"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`w-full min-h-[80px] p-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDarkTheme
                  ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => handlePostComment()}
                disabled={submitting || !newComment.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Post Comment</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading discussion...</span>
            </div>
          ) : topLevelComments.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 opacity-60 mb-2" />
              <p className="font-bold text-sm">No comments on this lesson yet.</p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Be the first to leave a comment or ask a question!
              </p>
            </div>
          ) : (
            topLevelComments.map((comment) => {
              const badge = getRoleBadge(comment.userRole)
              const replies = getReplies(comment.id)
              const isReplyingThis = replyToId === comment.id

              return (
                <div
                  key={comment.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDarkTheme
                      ? 'bg-slate-950/60 border-slate-800/80'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  {/* Top Level Comment Body */}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                      {comment.userImage ? (
                        <img
                          src={comment.userImage}
                          alt={comment.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{comment.userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {comment.userName}
                        </span>
                        <Badge
                          className={`text-[9px] font-black uppercase border px-2 py-0.2 rounded-full ${badge.color}`}
                        >
                          {badge.label}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 ml-auto">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-0.5">
                        {comment.content}
                      </p>

                      {/* Action Links */}
                      <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-slate-400">
                        <button
                          onClick={() => {
                            setReplyToId(isReplyingThis ? null : comment.id)
                            setReplyContent('')
                          }}
                          className="hover:text-indigo-500 transition-colors flex items-center gap-1"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>

                        {(currentUserId === comment.userId ||
                          ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(
                            (currentUserRole || '').toUpperCase()
                          )) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="hover:text-rose-500 transition-colors flex items-center gap-1 text-slate-400 hover:text-rose-400"
                          >
                            {deletingId === comment.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply Input Box */}
                  {isReplyingThis && (
                    <div className="mt-3 ml-8 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-indigo-500/30 space-y-2 animate-in fade-in duration-200">
                      <textarea
                        placeholder={`Replying to ${comment.userName}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className={`w-full min-h-[60px] p-2.5 rounded-lg text-xs font-medium focus:outline-none transition-all ${
                          isDarkTheme
                            ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyToId(null)}
                          className="h-8 rounded-lg text-xs font-bold text-slate-400"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePostComment(comment.id)}
                          disabled={submitting || !replyContent.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 rounded-lg text-xs font-bold px-3"
                        >
                          {submitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Post Reply'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Child Replies */}
                  {replies.length > 0 && (
                    <div className="mt-3 ml-6 pl-3 border-l-2 border-indigo-500/20 space-y-3">
                      {replies.map((reply) => {
                        const replyBadge = getRoleBadge(reply.userRole)
                        return (
                          <div key={reply.id} className="flex gap-2.5 items-start pt-1">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-1" />
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                              {reply.userImage ? (
                                <img
                                  src={reply.userImage}
                                  alt={reply.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{reply.userName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>

                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {reply.userName}
                                </span>
                                <Badge
                                  className={`text-[8px] font-black uppercase border px-1.5 py-0.1 rounded-full ${replyBadge.color}`}
                                >
                                  {replyBadge.label}
                                </Badge>
                                <span className="text-[9px] font-semibold text-slate-400 ml-auto">
                                  {formatTimeAgo(reply.createdAt)}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {reply.content}
                              </p>

                              {(currentUserId === reply.userId ||
                                ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(
                                  (currentUserRole || '').toUpperCase()
                                )) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  disabled={deletingId === reply.id}
                                  className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1 pt-0.5"
                                >
                                  {deletingId === reply.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
