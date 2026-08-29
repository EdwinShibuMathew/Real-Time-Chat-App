import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { getApiError } from "../lib/errors.js";
import { useAuthStore } from "./useAuthStore.js";

function appendUnique(messages, message) {
  return messages.some((item) => item._id === message._id) ? messages : [...messages, message];
}

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  messagesRequestId: 0,
  messageHandler: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(getApiError(error, "Could not load contacts"));
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    const requestId = get().messagesRequestId + 1;
    set({ isMessagesLoading: true, messagesRequestId: requestId, messages: [] });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      if (get().messagesRequestId === requestId && get().selectedUser?._id === userId) {
        set({ messages: res.data });
      }
    } catch (error) {
      if (get().messagesRequestId === requestId) {
        toast.error(getApiError(error, "Could not load messages"));
      }
    } finally {
      if (get().messagesRequestId === requestId) set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser || get().isSendingMessage) return false;

    set({ isSendingMessage: true });
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({ messages: appendUnique(state.messages, res.data) }));
      return true;
    } catch (error) {
      toast.error(getApiError(error, "Could not send message"));
      throw error;
    } finally {
      set({ isSendingMessage: false });
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    get().unsubscribeFromMessages();
    const handler = (newMessage) => {
      const selectedUserId = get().selectedUser?._id;
      const authUserId = useAuthStore.getState().authUser?._id;
      const belongsToConversation =
        (newMessage.senderId === selectedUserId && newMessage.receiverId === authUserId) ||
        (newMessage.senderId === authUserId && newMessage.receiverId === selectedUserId);
      if (belongsToConversation) {
        set((state) => ({ messages: appendUnique(state.messages, newMessage) }));
      }
    };
    socket.on("newMessage", handler);
    set({ messageHandler: handler });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const handler = get().messageHandler;
    if (socket && handler) socket.off("newMessage", handler);
    set({ messageHandler: null });
  },

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      messages: [],
      messagesRequestId: state.messagesRequestId + 1,
    })),

  reset: () => {
    get().unsubscribeFromMessages();
    set({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      isSendingMessage: false,
      messagesRequestId: get().messagesRequestId + 1,
    });
  },
}));
