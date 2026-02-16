import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import axios from "axios";
import { envConfig } from "../../config/envConfig";
import { sendToQueue } from "../../config/rabbitmq/producer";

const getUserV0Key = async (userId: string): Promise<string> => {
  const response = await axios.get(
    `${envConfig.GATEWAY_SERVICE_URL}/gateway/users/api/v1/user/${userId}/getapikey`,
  );
  return response.data?.data || "";
};

export const generateComponent: RequestHandler = async (req, res) => {
  try {
    const { prompt, image, userId, taskId } = req.body;

    if (!prompt) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Create Component query was failed",
            "Please provide a valid prompt",
          ),
        );
    }

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Component generate query was failed",
            "Please provide a valid user ID",
          ),
        );
    }

    // Fetch user's V0 API key
    const voApiKey = await getUserV0Key(userId);

    if (!voApiKey) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Component generate query was failed",
            "V0 API key not found for user",
          ),
        );
    }

    const createChatDetails = {
      prompt,
      image,
      userId,
      voApiKey,
      taskId
    };
    logger.info(createChatDetails);

    await sendToQueue('process_chat', createChatDetails);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Component generate query was success",
          "Details send to queue for processing",
        ),
      );
  } catch (error: any) {
    logger.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Component generate query internal server error",
          error,
        ),
      );
  }
};
