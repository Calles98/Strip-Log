"use client";

import { useState, useRef } from "react";

const types = ["Standard", "Duplicates", "Blanks"];

export default function Home() {
  const [files, setFiles] = useState([]); // Store multiple files
  const [downloadUrl, setDownloadUrl] = useState("");

  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files)); // Store all selected files as an array
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      alert("Please select at least one file!");
      return;
    }

    const formData = new FormData();
    // Append all files to the FormData object
    files.forEach((file) => {
      formData.append("files", file); // Key must match the backend's expected key
    });

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });
      

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      // Create a Blob URL for the downloaded file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Clear the file input after report is processed
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the input field
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  return (
    <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto">
      <h1 className="m-4 text-xl font-bold">
        Upload Files to Get the Strip Log
      </h1>
      <form encType="multipart/form-data" onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          name="files"
          multiple
        />
        <button
          type="submit"
          className="bg-slate-500 text-white p-5 rounded-md"
        >
          Upload and Process
        </button>
      </form>
      {downloadUrl && (
        <div className="text-xl font-thin">
          <h2>Download your processed report:</h2>
          <a
            className="hover:underline hover:text-blue-500"
            href={downloadUrl}
            download="report.html"
            onClick={() => setDownloadUrl("")}
          >
            Download Report
          </a>
        </div>
      )}
    </div>
  );
}
