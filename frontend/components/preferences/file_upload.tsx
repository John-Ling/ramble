"use client";
import { FileText, Upload } from "lucide-react"
import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';

interface FileItem {
  id: number;
  file: File;
  name: string;
  size: number;
  type: string;
  createdOn: number;
}



interface FileUploadProps {
  uid?: string;
}

export default function FileUpload({ uid }: FileUploadProps) {
  const allowedTypes = ['txt', 'doc', 'docx'];
  // const [files, setFiles] = useState<FileItem[]>([]);
  // const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "failed" | "idle">("idle");
  // const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  async function upload_file(file: FileItem) {

    const formData = new FormData();    
    formData.append("file", file.file);

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
  }

  async function upload_files(files: FileItem[]) {
    console.log(files);

    files.forEach(async (file: FileItem) => {
      await upload_file(file);
    })
  }


  const on_drag_over = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // setIsDragging(true);
    console.log("Dragged over");
  };

  const on_drag_leave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // setIsDragging(false);
    console.log("Left drag");
  };

  const on_drop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // setIsDragging(false);
    console.log("Dropped file");

    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const uploadFiles: FileItem[] = [];
    droppedFiles.forEach((file: File) => {
      uploadFiles.push({id: Date.now() + Math.random(), file: file, name: file.name, size: file.size, type: file.type} as FileItem);
    })

    await upload_files(uploadFiles);
    // addFiles(droppedFiles);
  };

  const on_file_select = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Selected file");
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log(selectedFiles);
      // addFiles(selectedFiles);
    }
  };

  const on_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("CHANGE");
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log(selectedFiles);
    }
  }


  return (
    <>
     <h3 className="font-bold text-2xl text-center mb-5">Upload Entries</h3>
      <div className="bg-[#111111] h-[30vh] w-full lg:w-1/2 flex flex-col justify-center items-center"
        onClick={() => fileInputRef.current?.click()}
        onDrop={on_drop}
        onDragLeave={on_drag_leave}
        onDragOver={on_drag_over}
      >
        <div className="flex justify-center items-center flex-col">
          <FileText className="size-16"/>
          <p className="mb-5 text-lg">Drag and Drop Files</p>
        </div>
        <label className="flex justify-center flex-col items-center">
          <Upload className="text-center"/> 
          <input ref={fileInputRef} id="file-upload" multiple className="hidden" type="file" />
        </label>
        <div className="pointer-events-none">
          or upload from your computer
        </div>
      </div>
    </>
  ) 
}