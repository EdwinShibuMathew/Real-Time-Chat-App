import { useEffect, useRef } from "react";

const LogoutConfirmationDialog = ({ isOpen, onCancel, onConfirm }) => {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      }
      cancelButtonRef.current?.focus();
    } else if (dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [isOpen]);

  const handleCancel = (event) => {
    event?.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === dialogRef.current) handleCancel(event);
      }}
    >
      <div className="modal-box">
        <h2 id="logout-dialog-title" className="text-lg font-bold">
          Log out?
        </h2>
        <p id="logout-dialog-description" className="py-4 text-base-content/70">
          Are you sure you want to log out?
        </p>
        <div className="modal-action">
          <button ref={cancelButtonRef} type="button" className="btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm}>
            Log out
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default LogoutConfirmationDialog;
