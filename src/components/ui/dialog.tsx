import { X } from 'lucide-react';

export function Dialog({ open, onClose, children, title, description }: { open: boolean, onClose: () => void, children: React.ReactNode, title: string, description: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-16">
      <div className="bg-white rounded-lg shadow-xl w-full h-full flex relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>
        <div className="w-1/2 p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-gray-500 mb-4">{description}</p>
          <div className="flex-grow flex flex-col justify-between">
            {children}
          </div>
        </div>
        <div className="w-1/2 bg-gray-100 rounded-r-lg">
          <img src="/images/request-access-bg.png" alt="Request Access Background" className="w-full h-full object-cover rounded-r-lg" />
        </div>
      </div>
    </div>
  );
}
