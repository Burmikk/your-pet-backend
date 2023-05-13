import path from "path";
import { Notice } from "../models/notice.js";
import { User } from "../models/users.js";
import { ctrlWrapper } from "../decorators/index.js";
import { moveFile, resizeImg, HttpError } from "../helpers/index.js";

const petAvatarsDirPath = path.resolve("public", "petPhotos");

// для пошуку оголошеннь по заголовку
const getNoticesByTitleandKeyword = async (req, res) => {
    const { title, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const regex = new RegExp(title, "i");
    const result = await Notice.find({ title: regex }, '', { skip, limit }).populate("owner")

    if (result.length === 0) {
        throw HttpError(404, "Not found");
    }

    res.json(result);
}

// для отримання оголошень по категоріям
const getNoticesByCategory = async (req, res) => {
    const { category, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const notices = await Notice.find({
        category: category ? category : "sell",
    }, '',  { skip, limit }).populate("owner")

    res.json(notices)
}

// для отримання оголошень по категоріям + по заголовку
const findNotices = async (req, res) => {
  const { sex, birth, title, category, page = 1, limit = 10 } = req.query
  const skip = (page - 1) * limit

  const regex = new RegExp(title, "i")
  const filters = { title: regex, category: category ? category : "sell" }
  
  if (sex && (sex === "male" || sex === "female")) {
    filters.sex = sex;
  }

  if (birth) {
    filters.birth = birth;
  }

  if (req.user) {
    const favorites = req.user.favorites || [];

    if (favorites.length > 0) {
      filters._id = { $in: favorites };
    }
  }

  const notices = await Notice.find(filters, null, { skip, limit })

  if (notices.length === 0) {
      throw HttpError(404, "Not found");
  }

  res.json(notices)
}

// для отримання одного оголошення
const getNoticeById = async (req, res) => {
    const { noticeId } = req.params
    const result = await Notice.findById(noticeId).populate("owner")
    if (!result) {
      throw HttpError(404, `Notice with ${noticeId} not found`)
    }
    res.json(result)
}

// для додавання оголошень відповідно до обраної категорії
const addNotice = async (req, res) => {
    const { _id: owner } = req.user
    
    await moveFile(req.file, petAvatarsDirPath);
    await resizeImg(path.join(petAvatarsDirPath, req.file.filename), _, 3);
    const photoURL = path.join("petPhotos", req.file.filename)

    const result = await Notice.create({...req.body, photoURL, owner})
    res.status(201).json(result);
}

// для отримання оголошень авторизованого кристувача створених цим же користувачем
const listNotices = async (req, res) => {
  const { _id: owner } = req.user
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit
  const result = await Notice.find({ owner }, '', { skip, limit })
  res.json(result)
}

// для видалення оголошення авторизованого користувача створеного цим же користувачем 
const removeNotice = async (req, res) => {
    const { noticeId } = req.params

    const result = await Notice.findByIdAndDelete(noticeId)
    if (!result) {
      throw HttpError(404, `Notice with ${noticeId} not found`)
    }
    res.status(200).json({message: "Notice deleted"})
}
  
const allListNotices = async (req, res) => {
    const notices = await Notice.find();

    if (notices.length === 0) {
      return res.status(404).json({ message: 'Notices not found' });
    }

    res.status(200).json({ notices })
}

export default {
    getNoticesByTitleandKeyword: ctrlWrapper(getNoticesByTitleandKeyword),
    getNoticesByCategory: ctrlWrapper(getNoticesByCategory),
    findNotices: ctrlWrapper(findNotices),
    getNoticeById: ctrlWrapper(getNoticeById),
    addNotice: ctrlWrapper(addNotice),
    listNotices: ctrlWrapper(listNotices),
  removeNotice: ctrlWrapper(removeNotice),
    allListNotices: ctrlWrapper(allListNotices),
}