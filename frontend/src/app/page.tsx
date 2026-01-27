"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";
import { BiSelectMultiple } from "react-icons/bi";
import { VscClearAll } from "react-icons/vsc";
import DropArea from "@/components/DropArea";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [filename, setFilename] = useState("");

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
    }
  };

  const handleDownload = () => {
    setDownloadUrl("");
    window.location.reload();
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
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

          <button
            type="submit"
            className="bg-slate-500 text-white p-4 rounded-md"
          >
            Upload and Process
          </button>
        </form>

        {downloadUrl && (
          <div className="mt-6 text-center">
            <h2>Download your processed report:</h2>
            <a
              href={downloadUrl}
              download={`${filename}_strip_log.html`}
              onClick={handleDownload}
              className="inline-block mt-3 bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-md"
            >
              Download Report
            </a>
          </div>
        )}
      </div>
      {logs.length > 0 && (
        <div className="flex w-full md:w-2/3 lg:w-1/3 border border-solid rounded-md bg-white  shadow-md">
          {logs.length > 0 && (
            <div className="w-full">
              <h2 className="text-lg px-4 py-2">
                Please select the logs you want:
              </h2>

              <div className="flex gap-x-6 border-t border-b border-black bg-slate-100 w-full p-4">
                <div className="flex gap-x-2">
                  <h2>Select All</h2>
                  <BiSelectMultiple
                    size={25}
                    className="cursor-pointer hover:text-slate-400"
                    onClick={() => setCheckedItems(logs)}
                  />
                </div>

                <VscClearAll
                  size={25}
                  className="cursor-pointer hover:text-slate-400"
                  onClick={() => setCheckedItems([])}
                />
              </div>

              {logs.map((log) => (
                <div key={log} className="flex items-center gap-x-3">
                  <CheckBox
                    log={log}
                    checkedItems={checkedItems}
                    handleCheckBoxChange={() => handleCheckboxChange(log)}
                  />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
