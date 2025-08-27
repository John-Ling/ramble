"use client";
import { date_to_db_date } from "@/lib/utils";
import { FileText} from "lucide-react"
import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';

interface FileItem {
  file: File;
  name: string;
  size: number;
  type: string;
  createdOn: string;
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

    const formData = new FormData(); 
    formData.append("file", file.file);
    formData.append("name", file.name);

    const createdOn = new Intl.DateTimeFormat("en-US").format(new Date()).replaceAll('/', '-');
    formData.append("createdOn", createdOn);
    
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
    console.log(files);

    files.forEach(async (file: FileItem) => {
      await upload_file(file);
    })
  }

  const on_drag_over = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const on_drag_leave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const on_drop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadStatus("uploading");
    const droppedFiles = Array.from(e.dataTransfer.files);
    const uploadFiles: FileItem[] = [];

    // format name
    

    droppedFiles.forEach((file: File) => {
      const formattedName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      uploadFiles.push({ file: file, name: formattedName, size: file.size, type: file.type} as FileItem);
    })
    await upload_files(uploadFiles);
    setUploadStatus("idle");
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

  return (
    <>
     <h3 className="font-bold text-2xl text-center mb-5">Upload Entries</h3>
      <div className="bg-[#111111] h-[30vh] w-full lg:w-3/5 flex flex-col justify-center items-center"
        onClick={() => fileInputRef.current?.click()}
        onDrop={on_drop}
        onDragLeave={on_drag_leave}
        onDragOver={on_drag_over}
      >
        <div className="flex justify-center items-center flex-col">
          <FileText className={`size-16 ${isDragging ? "text-orange-400" : "" }`} />
          <p className="mb-5 text-lg">{uploadStatus === "uploading" ? "Uploading..." : "Drag and Drop Files"}</p>
        </div>
        <input ref={fileInputRef} id="file-upload" multiple className="hidden" type="file" disabled={uploadStatus === "uploading" ? true : false} />
      </div>
    </>
  ) 
}