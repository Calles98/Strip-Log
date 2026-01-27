import { useState } from "react";
import { FaFileUpload } from "react-icons/fa";

type Props = {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

function DropArea({ files, setFiles }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center border-2 border-dashed bg-slate-100 rounded-md p-10 text-center transition ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
    >
      <div className="p-2 m-2 h-20 w-20 rounded-full bg-blue-100 cursor-pointer flex items-center justify-center">
        <FaFileUpload className="text-xl" />
      </div>

      <h2 className="text-xl font-bold">Click to upload or drag and drop</h2>
    </div>
  );
}

export default DropArea;
