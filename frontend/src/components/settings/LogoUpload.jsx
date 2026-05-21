import { useState, useRef } from 'react';
import Button from '../ui/Button';

export default function LogoUpload({ currentPath, onUpload, onDelete }) {
  const [preview, setPreview] = useState(currentPath ? `${currentPath}?t=${Date.now()}` : null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    setUploading(true);
    try {
      const { data } = await onUpload(formData);
      setPreview(`${data.logo_path}?t=${Date.now()}`);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    await onDelete();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleChange} className="hidden" />
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            <img src={preview} alt="Logo preview" className="max-h-20 object-contain" />
            <p className="text-xs text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="text-gray-400">
            <svg className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-sm">{uploading ? 'Uploading...' : 'Drop logo here or click to browse'}</p>
            <p className="text-xs mt-1">PNG or JPG, max 2MB</p>
          </div>
        )}
      </div>
      {preview && (
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Change</Button>
          <Button type="button" size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>Remove</Button>
        </div>
      )}
    </div>
  );
}
