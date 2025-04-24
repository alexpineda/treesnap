export const WebLimitBanner = ({
  files,
  bytes,
}: {
  files: number;
  bytes: number;
}) => (
  <div className="bg-amber-600/80 p-2 text-amber-100 px-4 rounded-md flex gap-4 flex-wrap">
    <span>
      Web version cap hit — {files.toLocaleString()} files /{" "}
      {(bytes / 1048576).toFixed(1)} MB.
    </span>
    <a
      href="https://www.reposnap.io/download"
      className="underline ml-3"
      target="_blank"
    >
      Download the desktop app for unlimited size
    </a>
  </div>
);
