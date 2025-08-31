"use client";
import { date_to_db_date } from "@/lib/utils";
import { FileText, Upload } from "lucide-react"
import React, { useState, useRef } from "react";
import { flushSync } from 'react-dom';


interface FileItem {
  file: File;
  name: string;
  size: number;
  type: string;
  createdOn: string;
  lastModified: number; // unix epoch for the last time a file was modified
}

interface FileUploadProps {
  uid?: string;
}

// probably remove this if doing initial demo since there are no checks to ensure the correct file
export default function FileUpload({ uid }: FileUploadProps) {
  // const allowedTypes = ['txt', 'doc', 'docx']; // add security checks for files later
  // const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "failed" | "idle">("idle");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload_file(file: FileItem) {
    console.log("Uploading file");
    const formData = new FormData(); 
    formData.append("file", file.file);
    formData.append("name", file.name);

    const createdOn =  date_to_db_date(new Intl.DateTimeFormat("en-US").format(new Date(file.lastModified)));
    formData.append("createdOn", createdOn);
    console.log(createdOn);

    if (!uid) {
      console.log("UID is null");
      return;
    }

    const response = await fetch(`http://localhost:3000/api/entries/${uid}/upload/`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Successfully uploaded files");
    }
    return;
  }

  async function upload_files(files: FileItem[]) {
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i+= BATCH_SIZE) 
    {
      const batch = files.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(file => upload_file(file)));
    }
  }

  const on_drag_over = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      flushSync(() => {
        console.log("Dragging");
        setIsDragging(true);
      })

    }
  };

  const on_drag_leave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      flushSync(() => {
        setIsDragging(false);
      });
    }
  };

  const on_drop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    console.log("Setting status");
    setUploadStatus(() => "uploading");
    const droppedFiles = Array.from(e.dataTransfer.files);
    const uploadFiles: FileItem[] = [];
    droppedFiles.forEach((file: File) => {
      const formattedName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      uploadFiles.push({ file: file, name: formattedName, size: file.size, type: file.type, lastModified: file.lastModified} as FileItem);
    })
    await upload_files(uploadFiles);

    setUploadStatus("success");

    await new Promise(r => setTimeout(r, 3000));
    setUploadStatus(() => "idle");
    return;
  };

  // const on_file_select = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("Selected file");
  //   if (e.target.files) {
  //     const selectedFiles = Array.from(e.target.files);
  //     console.log(selectedFiles);
  //     // addFiles(selectedFiles);
  //   }
  // };

  // const on_change = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("CHANGE");
  //   if (e.target.files) {
  //     const selectedFiles = Array.from(e.target.files);
  //     console.log(selectedFiles);
  //   }
  // }


  // set file upload message

  let message = "Drag and Drop Files"
  if (uploadStatus === "uploading") {
    message = "Uploading...";
  }

  if (uploadStatus === "success") {
    message = "Upload Complete";
  }

  return (
    <>
      <div className={`bg-card h-[30vh] w-full lg:w-4/5 flex flex-col justify-center items-center border-2`}
        onDrop={on_drop}
        onDragLeave={on_drag_leave}
        onDragOver={on_drag_over}
      >
        <h3 className="font-bold text-2xl text-center mb-5">Upload Entries</h3>
        <div className="flex justify-center items-center flex-col">
          {
            uploadStatus === "uploading" ? 
            <Upload className={`size-16 ${isDragging ? "text-orange-400" : "" }`} />
            : 
            <FileText className={`size-16 ${isDragging ? "text-orange-400" : "" }`} />
          }
          <p className="mb-5 text-lg">{message}</p>
        </div>
        <input ref={fileInputRef} id="file-upload" multiple className="hidden" type="file" disabled={uploadStatus === "uploading" ? true : false} />
      </div>
    </>
  ) 
}