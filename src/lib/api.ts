const API_URL = 'http://localhost:3001/api';

export const api = {
    // User
    createUser: async (userData: any) => {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return res.json();
    },

    // Assessments
    saveAssessment: async (data: any) => {
        const res = await fetch(`${API_URL}/assessments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    getAssessments: async (clerkId: string) => {
        const res = await fetch(`${API_URL}/assessments/user/${clerkId}`);
        return res.json();
    },

    // Mood
    saveMood: async (data: any) => {
        const res = await fetch(`${API_URL}/mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    getMoodHistory: async (clerkId: string) => {
        const res = await fetch(`${API_URL}/mood/user/${clerkId}`);
        return res.json();
    },

    // AI Chat (Gemini)
    analyze: async (prompt: string) => {
        const res = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        return res.json();
    },

    // Chat System
    createChatRoom: async (type: string, participants: string[]) => {
        const res = await fetch(`${API_URL}/chat/room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, participants }),
        });
        return res.json();
    },

    getChatRooms: async (clerkId: string) => {
        const res = await fetch(`${API_URL}/chat/rooms/${clerkId}`);
        return res.json();
    },

    getChatMessages: async (roomId: string) => {
        const res = await fetch(`${API_URL}/chat/room/${roomId}/messages`);
        return res.json();
    },

    sendMessage: async (messageData: any) => {
        const res = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData),
        });
        return res.json();
    },

    // Medicine AI
    saveMedicineAnalysis: async (userId: string, analysis: any) => {
        const res = await fetch(`${API_URL}/medicine/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, analysis }),
        });
        return res.json();
    },

    getMedicineHistory: async (clerkId: string) => {
        const res = await fetch(`${API_URL}/medicine/history/${clerkId}`);
        return res.json();
    },

    // Community
    getCommunityGroups: async () => {
        const res = await fetch(`${API_URL}/community/groups`);
        return res.json();
    },

    joinCommunityGroup: async (userId: string, groupId: string) => {
        const res = await fetch(`${API_URL}/community/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, groupId }),
        });
        return res.json();
    }
};
