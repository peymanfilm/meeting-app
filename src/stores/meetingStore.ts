import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Meeting, MeetingDecision } from '@/types';
import { mockMeetings } from '@/mocks/data';

interface MeetingState {
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  addDecision: (
    meetingId: string,
    decision: Omit<MeetingDecision, 'id' | 'meetingId'>,
  ) => MeetingDecision;
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set) => ({
      meetings: mockMeetings,
      addMeeting: (meeting) => {
        const newMeeting: Meeting = {
          ...meeting,
          id: `m${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ meetings: [...state.meetings, newMeeting] }));
        return newMeeting;
      },
      updateMeeting: (id, updates) =>
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      deleteMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        })),
      addDecision: (meetingId, decision) => {
        const newDecision: MeetingDecision = {
          ...decision,
          id: `d${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          meetingId,
        };
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, decisions: [...m.decisions, newDecision] }
              : m,
          ),
        }));
        return newDecision;
      },
    }),
    {
      name: 'meetings-storage',
    },
  ),
);
