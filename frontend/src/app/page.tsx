"use client";

import { redirect, useRouter } from "next/navigation";
import { useState, useRef } from "react";

const types = ["Standard", "Duplicates", "Blanks"];

export default function Home() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      // Create a Blob URL for the downloaded file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Clear the file input after report is processed
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the input field
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto">
      <div></div>
      <h1 className="m-4 text-xl font-bold">
        Upload File to get the Strip Log
      </h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} ref={fileInputRef} />
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
