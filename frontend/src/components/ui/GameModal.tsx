import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
}

export const GameModal: React.FC<ModalProps> = ({ open, onClose, title, children, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="modal-content bg-white p-6 rounded shadow-lg relative">
        <button className="close-button absolute top-2 right-2 text-xl" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold mb-2" id="modal-title">{title}</h3>
        <div id="modal-body" className="mb-4">{children}</div>
        {onConfirm && <button className="btn btn--primary" onClick={onConfirm}>Got it!</button>}
      </div>
    </div>
  );
};
