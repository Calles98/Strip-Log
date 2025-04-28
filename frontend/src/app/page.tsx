"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@headlessui/react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";

export default function Home() {    
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  
  const extractLogOptions = (file) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      const csvText = event.target.result;

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;
          if (data.length ===  0 || !data[0].Collar) {
            alert("Invalid CSV file format");
            return;
          }

          // Group collars
          let group = 0;
          let lastCollar = null;
          const groups = {};

          data.forEach((row) => {
            if (row.Collar !== lastCollar) {
              group++;
            }
            lastCollar = row.Collar;
            if (!groups[group]) {
              groups[group] = [];
            }
            groups[group].push(row);
          });

          // Extract first 'Collar' from each group
          const logOptionsList = Object.values(groups).map((group) => group[0].Collar);
          setLogs(logOptionsList);
        },
      });
    };
  };

  const handleCheckboxChange = (log) => {
    setCheckedItems((prevLogs) =>
      prevLogs.includes(log)
        ? prevLogs.filter((item) => item !== log) // Remove if unchecked
        : [...prevLogs, log] // Add if checked
    );
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      extractLogOptions(selectedFiles[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      alert("Please select at least one file!");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    checkedItems.forEach((log) => {
      formData.append("CheckedItems", log);
    });

    console.log([...formData]);
    

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Reset state after successful upload
      setFiles([]);
      setCheckedItems([]);
      fileInputRef.current.value = ""; // Clear input field
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleDownload = () => {
    setDownloadUrl("");
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto">
      <h1 className="m-4 text-xl font-bold">Upload Files to Get the Strip Log</h1>
      <form encType="multipart/form-data" onSubmit={handleSubmit} className="flex gap-4 items-start">
        <label htmlFor="file-upload" className="bg-blue-500 hover:bg-blue-400 rounded-md p-2 cursor-pointer text-white transition">Select Files</label>
        <input id="file-upload" className="hidden" type="file" onChange={handleFileChange} ref={fileInputRef} name="files" multiple />
        <div className="text-sm text-gray-700">
          {
            files.length > 0 ? (
              <ul className="list-disc list-inside">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            ) : (
              <span className="italic text-gray-500">No files selected</span>
            )
          }
        </div>
        <button type="submit" className="bg-slate-500 text-white p-5 rounded-md">
          Upload and Process
        </button>
      </form>

      {downloadUrl && (
        <div className="text-xl font-thin">
          <h2>Download your processed report:</h2>
          <div className="mt-5 text-center">
            <a
              className="bg-blue-500 hover:bg-blue-400 rounded-md p-3 text-center text-white cursor-pointer"
              href={downloadUrl}
              download="report.html"
              onClick={handleDownload}
            >
              Download Report
            </a>
          </div>
        </div>
      )}

      <div className="p-10">
        {logs.length > 0 && (
          <>
          <h2 className="text-lg">Please select the logs you want:</h2>
          {logs.map((log) => (
            <div key={log} className="flex gap-x-3 items-center">
              <h1>{log}</h1>
              <CheckBox log={log} checkedItems={checkedItems} handleCheckBoxChange={() => handleCheckboxChange(log)} />
            </div>
          ))}
          </>
        )
          }
      </div>
    </div>
  );
}
