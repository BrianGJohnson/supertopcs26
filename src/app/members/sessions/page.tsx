"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { Modal, ModalButton } from "@/components/ui/Modal";
import { IconFolders, IconTrash, IconExternalLink, IconCalendar, IconHash } from "@tabler/icons-react";
import { listSessions, deleteSession } from "@/hooks/useSessions";
import { getSeedsBySession } from "@/hooks/useSeedPhrases";
import type { Session } from "@/types/database";

interface SessionWithCount extends Session {
  phraseCount: number;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch sessions with phrase counts
  useEffect(() => {
    async function loadSessions() {
      try {
        const sessionList = await listSessions();
        
        // Fetch phrase counts for each session
        const sessionsWithCounts = await Promise.all(
          sessionList.map(async (session) => {
            try {
              const seeds = await getSeedsBySession(session.id);
              return { ...session, phraseCount: seeds.length };
            } catch {
              return { ...session, phraseCount: 0 };
            }
          })
        );
        
        setSessions(sessionsWithCounts);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSessions();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Open session
  const handleOpenSession = (sessionId: string) => {
    router.push(`/members/build/seed?session_id=${sessionId}`);
  };

  // Delete confirmation
  const handleDeleteClick = (session: SessionWithCount) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        <HeroModule
          icon={IconFolders}
          line1="Manage Your Builder"
          line2="Sessions"
          description="View, open, or delete your topic expansion sessions. Each session contains your seed phrase and all generated topics."
        />

        {/* Sessions List */}
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-white/40">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/40 text-lg">No sessions yet.</p>
              <p className="text-white/25 text-sm mt-2">
                Create a new session from the Seed page to get started.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="pl-8 pr-4 py-5 text-[16px] font-bold text-white/[0.86] uppercase tracking-[0.12em]">
                    Session Name
                  </th>
                  <th className="px-4 py-5 text-[16px] font-bold text-white/[0.86] uppercase tracking-[0.12em]">
                    <div className="flex items-center gap-2">
                      <IconCalendar size={16} className="text-white/50" />
                      Created
                    </div>
                  </th>
                  <th className="px-4 py-5 text-[16px] font-bold text-white/[0.86] uppercase tracking-[0.12em]">
                    <div className="flex items-center gap-2">
                      <IconHash size={16} className="text-white/50" />
                      Phrases
                    </div>
                  </th>
                  <th className="pl-4 pr-8 py-5 text-[16px] font-bold text-white/[0.86] uppercase tracking-[0.12em] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    <td className="pl-8 pr-4 py-5">
                      <span className="text-white/[0.86] group-hover:text-white transition-colors font-medium">
                        {session.name}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-white/60">
                      {session.created_at ? formatDate(session.created_at) : "—"}
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-3 py-1 bg-gradient-to-b from-[#2A2E34] to-[#1E2228] rounded-full text-sm text-white/70 border border-white/10 font-medium">
                        {session.phraseCount}
                      </span>
                    </td>
                    <td className="pl-4 pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Open Button */}
                        <button
                          onClick={() => handleOpenSession(session.id)}
                          className="px-4 py-2 rounded-lg bg-[#4A90D9]/10 hover:bg-[#4A90D9]/20 border border-[#4A90D9]/30 text-[#4A90D9] text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <IconExternalLink size={16} />
                          Open
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(session)}
                          className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <IconTrash size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Back to Builder Link */}
        <div className="text-center">
          <button
            onClick={() => router.push("/members/build/seed")}
            className="text-[#6B9BD1] hover:text-[#6B9BD1]/80 text-sm font-medium transition-colors"
          >
            ← Back to Topic Builder
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
        title="Delete Session"
        footer={
          <>
            <ModalButton
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </ModalButton>
            <ModalButton
              variant="danger"
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Deleting..." : "Delete Session"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            Are you sure you want to delete <span className="text-white font-medium">"{sessionToDelete?.name}"</span>?
          </p>
          <p className="text-white/60 text-[1.125rem] leading-relaxed">
            This will permanently remove the session and all <span className="text-white font-medium">{sessionToDelete?.phraseCount} phrases</span> associated with it.
          </p>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm font-medium">
              ⚠️ This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
