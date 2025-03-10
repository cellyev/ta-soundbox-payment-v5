const axios = require("axios");
const Transactions = require("../../models/transactionSchema");
const TransactionItems = require("../../models/transactionItemSchema");
const mongoose = require("mongoose");

exports.getById = async (req, res) => {
  const { transaction_id } = req.params;

  try {
    if (!transaction_id || !mongoose.Types.ObjectId.isValid(transaction_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Transaction ID",
        data: null,
      });
    }

    const existingTransaction = await Transactions.findById(transaction_id);

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        data: null,
      });
    }

    const existingTransactionItems = await TransactionItems.find({
      transaction_id,
    });

    if (!existingTransactionItems) {
      return res.status(404).json({
        success: false,
        message: "Transaction items not found",
        data: null,
      });
    }

    const vailovent_id = `VAILOVENT-${transaction_id}`;

    const midtransUrl =
      "https://payment.evognito.my.id/midtrans/get-data?param=VAILOVENT";

    const response = await axios.get(midtransUrl);

    if (!response.data || !response.data.data) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch transaction data from Midtrans",
        data: null,
      });
    }

    let midtransData = response.data.data;

    if (!Array.isArray(midtransData) && midtransData.transactions) {
      midtransData = midtransData.transactions;
    }

    if (!Array.isArray(midtransData)) {
      return res.status(500).json({
        success: false,
        message: "Invalid data format received from Midtrans",
        data: null,
      });
    }

    // Filter data dengan order_id yang sesuai
    const filteredData = midtransData.filter(
      (item) => item.order_id === vailovent_id
    );

    // Ambil satu transaksi saja (jika ada lebih dari satu)
    const selectedTransaction =
      filteredData.length > 0 ? filteredData[0] : null;

    return res.status(200).json({
      success: true,
      message: selectedTransaction
        ? "Matching transaction found"
        : "No matching transaction found in Midtrans",
      data: {
        transaction: existingTransaction,
        transactionItems: existingTransactionItems,
        midtransData: selectedTransaction,
      },
    });
  } catch (error) {
    console.error("Error in getById:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
      data: null,
    });
  }
};

exports.getAllTransactionByStatus = async (req, res) => {
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status parameter is required",
      data: null,
    });
  }

  try {
    const transactions = await Transactions.find({ status }).sort({
      createdAt: -1,
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No transactions found with status '${status}'`,
        data: [],
      });
    }
    const transactionItems = await TransactionItems.find({
      transaction_id: {
        $in: transactions.map((transaction) => transaction.id),
      },
    });
    if (!transactionItems) {
      return res.status(404).json({
        success: false,
        message: "No transaction items found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Transactions with status '${status}' successfully retrieved`,
      data: {
        Transactions: transactions,
        TransactionItems: transactionItems,
      },
    });
  } catch (error) {
    console.error("Error in getAllTransactionByStatus:", error.message);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.find({});
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found",
        data: null,
      });
    }

    const transactionItems = await TransactionItems.find({
      transaction_id: transactions.map((transaction) => transaction.id),
    });

    if (!transactionItems) {
      return res.status(404).json({
        success: false,
        message: "No transaction items found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transactions successfully retrieved",
      data: transactions,
    });
  } catch (error) {
    console.error("Error in getAllTransactions:", error.message);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};

exports.getTransactionBySuccessAndIsRead = async (req, res) => {
  try {
    const transaction = await Transactions.find({
      status: "completed",
      isRead: false,
    })
      .sort({ createdAt: 1 })
      .limit(1);

    if (!transaction || transaction.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No transaction found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transactions successfully retrieved",
      data: transaction,
    });
  } catch (error) {
    console.error(
      "Error in getAllTransactionBySuccessAndIsRead:",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};
