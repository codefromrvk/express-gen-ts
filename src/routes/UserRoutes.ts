import HttpStatusCodes from '@src/constants/HttpStatusCodes';

import UserService from '@src/services/UserService';
import { IUser } from '@src/models/User';
import { IReq, IRes } from './types/express/misc';
import axios from 'axios'
import crypto from 'crypto'

// **** Functions **** //

/**
 * Get all users.
 */
async function getAll (_: IReq, res: IRes) {
  const users = await UserService.getAll();
  return res.status(HttpStatusCodes.OK).json({ users });
}

/**
 * Add one user.
 */
async function add (req: IReq<{ user: IUser }>, res: IRes) {
  const { user } = req.body;
  await UserService.addOne(user);
  return res.status(HttpStatusCodes.CREATED).end();
}

/**
 * Update one user.
 */
async function update (req: IReq<{ user: IUser }>, res: IRes) {
  const { user } = req.body;
  await UserService.updateOne(user);
  return res.status(HttpStatusCodes.OK).end();
}

/**
 * Delete one user.
 */
async function delete_ (req: IReq, res: IRes) {
  const id = +req.params.id;
  await UserService.delete(id);
  return res.status(HttpStatusCodes.OK).end();
}
/**
 * Test one user.
 */
async function test (req: IReq, res: IRes) {
  try {
    const id = +req.params.id;
    console.log("hit");
    const merchantTransactionId = 'M' + Date.now();
    console.log("txn", { merchantTransactionId });
    const data = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: 'MUID' + 22,
      name: "king",
      amount: 1000,
      redirectUrl: `https://express-gen-ts.hop.sh/api/users/status/${merchantTransactionId}`,
      redirectMode: 'POST',
      mobileNumber: 1111,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };


    console.log({ data });

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadMain + '/pg/v1/pay' + process.env.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;
    console.log({ checksum, payloadMain });

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
    const options = {
      method: 'POST',
      url: prod_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: payloadMain
      }
    }
    axios.request(options).then(function (response) {
      console.log({ response });
      return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
    })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false
    })
  }

  // await UserService.delete(id);
  // return res.status(HttpStatusCodes.OK).end();
}
async function status (req: IReq, res: IRes) {
  console.log("status", req.body);

  const merchantTransactionId = req.params['txnId']
  const merchantId = process.env.MERCHANT_ID
  const keyIndex = 1;
  const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + process.env.SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + "###" + keyIndex;
  const options = {
    method: 'GET',
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': `${merchantId}`
    }
  };
  // CHECK PAYMENT STATUS
  axios.request(options).then(async (response) => {
    if (response.data.success === true) {
      console.log(response.data)
      return res.status(200).send({ success: true, message: "Payment " + response.data.data.state });
    } else {
      return res.status(400).send({ success: false, message: "Payment Failure" });
    }
  })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ msg: err.message });
    });

  // await UserService.delete(id);
  // return res.status(HttpStatusCodes.OK).end();
}


// **** Export default **** //

export default {
  getAll,
  add,
  update,
  delete: delete_,
  status,
  test
} as const;
