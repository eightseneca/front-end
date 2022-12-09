import {ethers} from 'ethers';
import {DOCUMENT_TRACKER_ADDRESS} from './constants';
import {DocumentTrackerContract} from './types';
import DocumentTrackerAbi from "./abis/DocumentTracker.json";

// @ts-ignore
const { ethereum } = window;
export const Provider = new ethers.providers.Web3Provider(ethereum);
export const DocumentTracker = new ethers.Contract(DOCUMENT_TRACKER_ADDRESS, DocumentTrackerAbi, Provider) as DocumentTrackerContract;