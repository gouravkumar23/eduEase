"use client";

import { DownloadRepository, Download } from '../repositories/DownloadRepository';

export class DownloadService {
  public static async registerRelease(download: Download): Promise<void> {
    await DownloadRepository.save(download);
  }

  public static async getLatestReleases(): Promise<Download[]> {
    return await DownloadRepository.getAll();
  }
}