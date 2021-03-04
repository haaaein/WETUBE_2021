/**
 * render 함수의 첫번째 인자는 템플릿이고, 
 * 두번째 인자는 템플릿에 추가할 정보가 담긴 객체
 */
import routes from "../routes";
import Video from "../models/Video";
import Comment from "../models/Comment";

export const home = async (req, res) => {
    try {
        const videos = await Video.find({}).sort({ _id: -1 }); 
        //-1은 위아래 순서를 바꾸겠다는 약속. id, 제목 등으로 정렬 가능.
        res.render("home", { pageTitle: "Home", videos });
    } catch(error){
        console.log(error);
        res.render("home", { pageTitle: "Home", videos: [] });
    }
};

export const search = async (req, res) => {
  const {
    query: { term: searchingBy }
  } = req;
  let videos = [];
  try {
    videos = await Video.find({ title: { $regex: searchingBy, $options: "i" } 
    });
  } catch(error) {
    console.log(error);
  }
  res.render("search", { pageTitle: "Search", searchingBy, videos });
}; 

export const getUpload = (req, res) => 
    res.render("upload", { pageTitle: "Upload" });

export const postUpload = async (req, res) => {
    const {
        body: { title, description },
        file: { location }
    } = req;
    const newVideo = await Video.create({
        fileUrl: location,
        title,
        description,
        creator: req.user.id
    });
    req.user.videos.push(newVideo.id);
    req.user.save();
    res.redirect(routes.videoDetail(newVideo.id));
};

export const videoDetail = async (req, res) => {
    const {
        params: {id}
    } = req;
    try {
        const video = await Video.findById(id)
            .populate("creator")
            .populate("comments");
        res.render("videoDetail", { pageTitle: video.title, video });
    } catch(error) {
        res.redirect(routes.home);
    }
};
    

export const getEditVideo = async (req, res) => {
    const {
        params: {id}
    } = req;
    try {
        const video = await Video.findById(id);
        if(video.creator !== req.user.id) {
            throw Error();
        } else {
            res.render("editVideo", {pageTitle: `Edit ${video.title}`, video});
        }
    } catch(error) {
        res.redirect(routes.home);
    }
};
    

export const postEditVideo = async (req, res) => {
    const {
        params: {id},
        body: {title, description}
    } = req;
    try {
        await Video.findOneAndUpdate({ _id: id }, { title, description });
        res.redirect(routes.videoDetail(id));
    } catch(error) {
        res.redirect(routes.home);
    }
};

export const deleteVideo = async (req, res) => {
    const {
      params: { id }
    } = req;
    try {
        const video = await Video.findById(id);
        if(video.creator !== req.user.id) {
            throw Error();
        } else {
            await Video.findOneAndRemove({ _id: id });
        }
    } catch (error) {
        console.log(error);
    }
    res.redirect(routes.home);
};

// Register Video View

export const postRegisterView = async (req, res) => {
    const {
        params: { id }
    } = req;
    try {
        const video = await Video.findById(id);
        video.views += 1;
        video.save();
        res.status(200); //ok
    } catch (error) {
        res.status(400);
    } finally {
        res.end();
    }
};

//Add comment

export const postAddComment = async (req, res) => {
    const {
        params: { id },
        body: { comment },
        user
    } = req;
    try {
        const video = await Video.findById(id);
        const newComment = await Comment.create({
            text: comment,
            creator: user.id
        });
        video.comments.push(newComment._id);
        video.save();
    } catch (error) {
        res.status(400);
    } finally {
        res.end();
    }
};