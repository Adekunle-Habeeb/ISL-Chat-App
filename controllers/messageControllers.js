const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/message");
const Chat = require("../models/chat");
const User = require("../models/Users");

const allMessages = expressAsyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId})
            .populate("sender", "name email")
            .populate("receiver")
            .populate("chat")
        res.json(messages)
    }   catch (error) {
        res.status(400).json({msg: "error"})
    }
})


// const sendMessage = expressAsyncHandler(async (req, res) => {
//     const { content, chatId } = req.body;

//     if (!content || !chatId) {
//         return res.sendStatus(400);
//     }

//     try {
//         let chat = await Chat.findOne({
//             isGroupChat: false,
//             users: { $all: [req.user._id, chatId] }
//         });

//         if (!chat) {
//             chat = await Chat.create({
//                 chatName: "Private Chat",
//                 isGroupChat: false,
//                 users: [req.user._id, chatId]
//             });
//         }

//         // Determine the receiver based on the users in the chat
//         const receiver = chat.users.find(userId => String(userId) !== String(req.user._id));

//         const newMessage = await Message.create({
//             sender: req.user._id,
//             receiver: receiver, // Set the receiver based on the chat's users
//             content: content,
//             chat: chat._id
//         });

//         // Populate message details by querying the message with the populated fields
//         const populatedMessage = await Message.findById(newMessage._id)
//             .populate("sender", "name")
//             .populate("chat")
//             .populate("receiver");

//         // Update the latest message in the chat
//         await Chat.findByIdAndUpdate(chat._id, { latestMessage: populatedMessage });

//         // Send the populated message as the response
//         res.json(populatedMessage);
//     } catch (error) {
//         console.error("Error sending message:", error);
//         res.status(500).json({ msg: "Error sending message" });
//     }
// });


const sendMessage = expressAsyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return res.sendStatus(400);
    }

    let newMessage; // Declare the variable here

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ msg: "Chat not found" });
        }

        let sender;

        // Determine the type of chat (group or private)
        if (chat.isGroupChat) {
            // This is a group chat, and the sender is the user sending the message.
            sender = req.user._id;

            // Create the group chat message.
            newMessage = await Message.create({
                sender: sender,
                content: content,
                chat: chat._id
            });
        } else {
            // This is a private chat; determine the receiver based on the users in the chat.
            const receiver = chat.users.find(userId => String(userId) !== String(req.user._id));
            sender = req.user._id;

            // Create the private chat message with a specific receiver.
            newMessage = await Message.create({
                sender: sender,
                receiver: receiver,
                content: content,
                chat: chat._id
            });
        }

        // Populate message details by querying the message with the populated fields
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "name")
            .populate("chat")
            .populate("receiver");

        // Update the latest message in the chat
        await Chat.findByIdAndUpdate(chat._id, { latestMessage: populatedMessage });

        // Send the populated message as the response
        res.json(populatedMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ msg: "Error sending message" });
    }
});


module.exports = { allMessages, sendMessage}