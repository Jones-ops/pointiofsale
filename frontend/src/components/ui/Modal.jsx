import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className={`w-full ${sizes[size]} bg-white rounded-xl shadow-xl p-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95`}>
            {title && <DialogTitle className="text-lg font-semibold mb-4">{title}</DialogTitle>}
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
