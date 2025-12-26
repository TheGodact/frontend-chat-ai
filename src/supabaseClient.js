// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ใส่ URL และ Key เดิมที่คุณเคยใช้ตอนทำ Python
const supabaseUrl = 'https://ldarzpdiedgznolqcdvh.supabase.co'
const supabaseKey = 'sb_publishable_XiSdQlNdD6s_0ryroJq1IA_SgsHLQ_w'

export const supabase = createClient(supabaseUrl, supabaseKey)