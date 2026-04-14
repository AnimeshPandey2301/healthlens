"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const userId = formData.get("userId") as string; // You'd get this from Supabase auth

  // 2. Write data to the DB
  await prisma.medicalProfile.upsert({
    where: { id: userId }, // Assuming ID is the unique link
    update: { fullName },
    create: { 
      userId,
      fullName 
    },
  });

  // Refresh the page data
  revalidatePath('/profile');
}