import React from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  size?: 'sm' | 'full'
  children: React.ReactNode
}

const SIZE_CLASSES = {
  sm: 'w-full max-w-md',
  full: 'w-full max-w-[90vw] min-w-[50vw] min-h-[50vh]',
}

export default function Modal({ open, onClose, size = 'full', children }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-lg shadow-lg p-6 max-h-[90vh] mx-4 overflow-y-auto ${SIZE_CLASSES[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
        <div className="pr-8">{children}</div>
      </div>
    </div>
  )
}
