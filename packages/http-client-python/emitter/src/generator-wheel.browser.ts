import wheel from "../../generator/dist/pygen-0.1.0-py3-none-any.whl";

export const generatorWheelUrl = new URL(wheel, import.meta.url).href;
