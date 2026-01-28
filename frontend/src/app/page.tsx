"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";
import { BiSelectMultiple } from "react-icons/bi";
import { VscClearAll } from "react-icons/vsc";
import DropArea from "@/components/DropArea";
import { FaRegFileAlt, FaSearch } from "react-icons/fa";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [filename, setFilename] = useState("");
  const [filtered, setFiltered] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ─────────────────────────────────────────────
  // Extract log options from FIRST CSV file
  // ─────────────────────────────────────────────
  const extractLogOptions = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvText = event.target.result;

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;

          if (!data.length || !data[0].Collar) {
            alert("Invalid CSV file format");
            return;
          }

          let group = 0;
          let lastCollar = null;
          const groups = {};

          data.forEach((row) => {
            if (row.Collar !== lastCollar) group++;
            lastCollar = row.Collar;

            if (!groups[group]) groups[group] = [];
            groups[group].push(row);
          });

          const logOptionsList = Object.values(groups).map(
            (group) => group[0].Collar,
          );

          setLogs(logOptionsList);
          setCheckedItems([]);
        },
      });
    };

    reader.readAsText(file);
  };

  // ─────────────────────────────────────────────
  // React to file changes (drag OR click)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (files.length > 0) {
      extractLogOptions(files[0]);
    } else {
      setLogs([]);
      setCheckedItems([]);
    }
  }, [files]);

  // ─────────────────────────────────────────────
  // Checkbox logic
  // ─────────────────────────────────────────────
  const handleCheckboxChange = (log) => {
    setCheckedItems((prev) =>
      prev.includes(log) ? prev.filter((item) => item !== log) : [...prev, log],
    );
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.length) {
      alert("Please select at least one file!");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));
    checkedItems.forEach((log) => formData.append("CheckedItems", log));

    setFilename(files[0].name.split("_")[0]);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setFiles([]);
      setCheckedItems([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloadUrl("");
    window.location.reload();
  };

  const filterdLogs = logs.filter((log) =>
    log.toLowerCase().includes(filtered.toLowerCase()),
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col sm:flex-row items-center justify-center gap-4 backdrop-blur-md bg-black/30">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-white text-lg font-semibold">
            Processing...
          </span>
        </div>
      )}
      <div className="flex flex-col gap-y-10 min-h-screen bg-slate-100 justify-center items-center mx-auto">
        <h1 className="m-4 text-xl font-bold">
          Upload Files to Get the Strip Log
        </h1>

        <div className="flex w-full md:w-2/3 lg:w-1/3 flex-col rounded-md border bg-white p-4 shadow-md">
          <form
            encType="multipart/form-data"
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4"
          >
            <label htmlFor="file-upload" className="w-full cursor-pointer">
              <DropArea files={files} setFiles={setFiles} />
            </label>

            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                if (!e.target.files) return;

                const selected = Array.from(e.target.files);
                setFiles((prev) => [...prev, ...selected]);
                e.target.value = "";
              }}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-100 border border-dashed mx-auto rounded-md w-full p-5 m-5">
              {downloadUrl ? (
                <>
                  <h2 className="font-bold">Download your processed report</h2>
                  <a
                    href={downloadUrl}
                    download={`${filename}_strip_log.html`}
                    onClick={handleDownload}
                    className="inline-block mt-3 bg-blue-500 hover:bg-blue-400 hover:cursor-pointer text-white p-3 rounded-md"
                  >
                    Download Report
                  </a>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <FaRegFileAlt className="shrink-0" />
                    {files.length > 0 ? (
                      <div className="relative group inline-block">
                        <h1 className="cursor-pointer font-medium">
                          {files[0].name}{" "}
                          {files.length > 1 && `... (${files.length - 1})`}
                        </h1>

                        {/* Hover list */}
                        <div className="absolute left-0 mt-2 w-max max-w-sm rounded-md border bg-white shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition pointer-events-none group-hover:pointer-events-auto z-10">
                          <div className="p-3 space-y-1">
                            {files.map((file, idx) => (
                              <p key={idx} className="text-sm text-gray-700">
                                {file.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span>No File Selected</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="bg-slate-500 text-white p-4 rounded-md cursor-pointer"
                  >
                    Upload and Process
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
        {files.length > 0 && (
          <div className="flex w-full md:w-2/3 lg:w-1/3 border border-solid rounded-md bg-white  shadow-md">
            {logs.length > 0 && (
              <div className="w-full">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pt-5 px-3 pb-6 w-full">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Select logs for analysis
                  </h2>

                  <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-100"
                      type="text"
                      placeholder="Filter logs..."
                      value={filtered}
                      onChange={(e) => setFiltered(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-x-6 border-t border-b  bg-slate-100 w-full p-4">
                  <div
                    className="flex gap-x-2 hover:text-blue-500 hover:cursor-pointer"
                    onClick={() => setCheckedItems(logs)}
                  >
                    <h2>Select All</h2>
                    <BiSelectMultiple size={25} />
                  </div>
                  <div
                    className="flex gap-x-2 hover:text-blue-500 hover:cursor-pointer"
                    onClick={() => setCheckedItems([])}
                  >
                    <h2>Clear All</h2>
                    <VscClearAll size={25} />
                  </div>
                </div>

                <div className="max-h-54 overflow-y-auto border-b px-4 sm:px-8 min-h-8">
                  {filterdLogs.map((log) => (
                    <div key={log} className="flex items-center gap-x-3 p-1">
                      <CheckBox
                        log={log}
                        checkedItems={checkedItems}
                        handleCheckBoxChange={() => handleCheckboxChange(log)}
                      />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="flex justify-end p-4">
                  <p
                    className="p-2 text-base sm:text-lg cursor-pointer hover:text-blue-500 hover:underline"
                    onClick={() => setFiles([])}
                  >
                    Cancel
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <footer className="p-5 w-full sticky bottom-0 bg-slate-100">
          <p className="text-center text-slate-400 font-extralight text-sm">
            &copy; 2024 Your Company. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
