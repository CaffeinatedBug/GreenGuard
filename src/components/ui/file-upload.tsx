import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

export const FileUpload = ({
    onChange,
    accept,
}: {
    onChange?: (files: File[]) => void;
    accept?: Record<string, string[]>;
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (newFiles: File[]) => {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        onChange && onChange(newFiles);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const { getRootProps, isDragActive } = useDropzone({
        multiple: false,
        noClick: true,
        onDrop: handleFileChange,
        accept: accept,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    return (
        <div className="w-full" {...getRootProps()}>
            <motion.div
                onClick={handleClick}
                whileHover="animate"
                className="p-6 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
            >
                <input
                    ref={fileInputRef}
                    id="file-upload-handle"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
                    className="hidden"
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                    <GridPattern />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <p className="relative z-20 font-sans font-bold text-slate-300 text-base">
                        Upload Bill/Invoice
                    </p>
                    <p className="relative z-20 font-sans font-normal text-slate-500 text-sm mt-2">
                        Drag or drop your files here or click to upload
                    </p>
                    <div className="relative w-full mt-6 max-w-xl mx-auto">
                        {files.length > 0 &&
                            files.map((file, idx) => (
                                <motion.div
                                    key={"file" + idx}
                                    layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                                    className={cn(
                                        "relative overflow-hidden z-40 bg-slate-800 flex flex-col items-start justify-start p-4 mt-4 w-full mx-auto rounded-md",
                                        "shadow-lg border border-slate-700"
                                    )}
                                >
                                    <div className="flex justify-between w-full items-center gap-4">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="text-base text-slate-300 truncate max-w-xs"
                                        >
                                            {file.name}
                                        </motion.p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-emerald-400 bg-emerald-500/20"
                                        >
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </motion.p>
                                    </div>

                                    <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-slate-500">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="px-1 py-0.5 rounded-md bg-slate-700"
                                        >
                                            {file.type || 'Unknown type'}
                                        </motion.p>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                        >
                                            modified{" "}
                                            {new Date(file.lastModified).toLocaleDateString()}
                                        </motion.p>
                                    </div>
                                </motion.div>
                            ))}
                        {!files.length && (
                            <motion.div
                                layoutId="file-upload"
                                variants={mainVariant}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className={cn(
                                    "relative group-hover/file:shadow-2xl z-40 bg-slate-800 border border-slate-700 flex items-center justify-center h-24 mt-4 w-full max-w-[6rem] mx-auto rounded-md",
                                    "shadow-[0px_10px_50px_rgba(0,0,0,0.3)]"
                                )}
                            >
                                {isDragActive ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-emerald-400 flex flex-col items-center"
                                    >
                                        Drop it
                                        <IconUpload className="h-4 w-4 text-emerald-400" />
                                    </motion.p>
                                ) : (
                                    <IconUpload className="h-4 w-4 text-slate-400" />
                                )}
                            </motion.div>
                        )}

                        {!files.length && (
                            <motion.div
                                variants={secondaryVariant}
                                className="absolute opacity-0 border border-dashed border-emerald-500 inset-0 z-30 bg-transparent flex items-center justify-center h-24 mt-4 w-full max-w-[6rem] mx-auto rounded-md"
                            ></motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export function GridPattern() {
    const columns = 21;
    const rows = 6;
    return (
        <div className="flex bg-slate-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
            {Array.from({ length: rows }).map((_, row) =>
                Array.from({ length: columns }).map((_, col) => {
                    const index = row * columns + col;
                    return (
                        <div
                            key={`${col}-${row}`}
                            className={`w-8 h-8 flex shrink-0 rounded-[2px] ${index % 2 === 0
                                    ? "bg-slate-800"
                                    : "bg-slate-800 shadow-[0px_0px_1px_2px_rgba(0,0,0,0.5)_inset]"
                                }`}
                        />
                    );
                })
            )}
        </div>
    );
}
