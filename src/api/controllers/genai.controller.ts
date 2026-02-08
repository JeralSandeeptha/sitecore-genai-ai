import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import axios from "axios";
import { envConfig } from "../../config/envConfig";
import { v0 } from "v0-sdk";

export const generateComponent: RequestHandler = async (req, res) => {
  try {
    const { prompt, image } = req.body;

    if (!prompt) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Prompt is required",
            "Please provide a valid prompt",
          ),
        );
    }

    // Get embeddings related to user prompt
    const response = await axios.get(
      `${envConfig.KNOWLEDGE_API_URL}/api/v1/search?query=${encodeURIComponent(prompt)}`,
    );

    const resData = response.data;

    try {
      // Create a new chat on Vercel with the Prompt / given data

      const examplesText = resData.data.points
      .slice(0, 5) // pick top 5 examples for token efficiency
      .map((p: any, i: number) => {
        const text = p.payload?.text ?? "";
        const source = p.payload?.metadata?.source ?? "N/A";
        const path = p.payload?.metadata?.path ?? "N/A";

        return `
          Example ${i + 1}:
          Path: ${path}
          Source: ${source}
          Content:
          ${text}
        `;
      })
      .join("\n\n");
      
      const chat = await v0.chats.create({
        message: `
            You are a senior frontend engineer in Sitecore. You are developing XM Cloud React Components.

            Task:
            ${prompt}
            Reference image:
            ${image}

            Examples:
            ${examplesText}

            Output format:
            - Return ONLY the React component code
            - Create: .tsx file realted to the component
          `,
      });

      console.log(chat);
      logger.info("Component generate query was success");

      res
        .status(HTTP_STATUS.OK)
        .json(
          new SuccessResponse(
            HTTP_STATUS.OK,
            "Component generate query was success",
            "Chat created successfully!",
          ),
        );
    } catch (error: any) {
      if (error?.response) {
        console.error("API Error:", error.response.data);
        console.error("Status:", error.response.status);
      } else {
        console.error("Unexpected error:", error);
      }

      logger.error(error);
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Component generate query was failed",
            "V0 API Request was failed",
          ),
        );
    }
  } catch (error: any) {
    logger.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Component generate query was failed",
          error,
        ),
      );
  }
};
