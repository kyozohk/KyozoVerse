
import { X } from 'lucide-react';

export function Dialog({ open, onClose, children, title, description }: { open: boolean, onClose: () => void, children: React.ReactNode, title: string, description: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-500 mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
}
