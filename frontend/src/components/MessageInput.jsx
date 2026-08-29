import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { readFileAsDataUrl, validateImageFile } from "../lib/images.js";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSendingMessage } = useChatStore();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    try {
      setImagePreview(await readFileAsDataUrl(file));
    } catch (error) {
      toast.error(error.message);
      e.target.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      const sent = await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      if (!sent) return;
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // The store displays the error; preserve the draft for retry.
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            aria-label="Message"
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            disabled={isSendingMessage}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={isSendingMessage || (!text.trim() && !imagePreview)}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
