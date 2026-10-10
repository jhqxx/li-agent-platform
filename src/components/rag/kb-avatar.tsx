/* eslint-disable @next/next/no-img-element */

/** 知识库头像：icon 可以是 emoji 或图片 URL/dataURL，统一在此渲染 */
export function KbAvatar({
  icon,
  className = "size-10 text-xl",
  rounded = "rounded-lg",
}: {
  icon: string;
  className?: string;
  rounded?: string;
}) {
  const isImage = icon.startsWith("data:") || icon.startsWith("http");
  if (isImage) {
    return (
      <span className={`flex shrink-0 items-center justify-center overflow-hidden border bg-background ${rounded} ${className}`}>
        <img src={icon} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span className={`flex shrink-0 items-center justify-center bg-muted ${rounded} ${className}`}>
      {icon}
    </span>
  );
}
