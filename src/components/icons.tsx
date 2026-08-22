import type { ComponentProps } from "react";

/** Hand-drawn-style stroke icons to match the brand illustration. */

function Base({ children, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconHome(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </Base>
  );
}

export function IconShop(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </Base>
  );
}

export function IconShelfPlus(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M4 4v16M20 4v16M4 19h16M4 11h16" />
      <path d="M7 11V7.6M10 11V6.8M13 11V7.8" />
      <path d="M17 6.2v3.6M15.2 8h3.6" />
    </Base>
  );
}

export function IconBasket(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M4.5 9.5h15l-1.4 9a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7l-1.4-9Z" />
      <path d="M8.5 9.5 12 4l3.5 5.5" />
      <path d="M9.5 13v3.5M14.5 13v3.5" />
    </Base>
  );
}

export function IconMore(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M5 7.5h14M5 12h14M5 16.5h9" />
    </Base>
  );
}

export function IconBook(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M12 6.5C10.6 5 8.6 4.4 4.5 4.5V18c4.1-.1 6.1.5 7.5 2 1.4-1.5 3.4-2.1 7.5-2V4.5c-4.1-.1-6.1.5-7.5 2Z" />
      <path d="M12 6.5V20" />
    </Base>
  );
}

export function IconSearch(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15.5 15.5 4 4" />
    </Base>
  );
}

export function IconX(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function IconArrowRight(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M4 12h15M14 6.5 19.5 12 14 17.5" />
    </Base>
  );
}

export function IconTrash(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7" />
      <path d="M10.5 10.5v5M13.5 10.5v5" />
    </Base>
  );
}

export function IconCheck(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Base>
  );
}

export function IconHeart(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="M12 20c-5-3.4-8-6.4-8-9.6C4 8 5.8 6 8.2 6c1.6 0 3 .9 3.8 2.2C12.8 6.9 14.2 6 15.8 6 18.2 6 20 8 20 10.4c0 3.2-3 6.2-8 9.6Z" />
    </Base>
  );
}

export function IconPencil(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5Z" />
      <path d="m12.5 7.5 4 4" />
    </Base>
  );
}

export function IconChevronDown(props: ComponentProps<"svg">) {
  return (
    <Base {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Base>
  );
}
