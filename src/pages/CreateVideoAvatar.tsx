import { uploadFileToSupabaseStorage, supabase } from "../lib/supabase";
import { n8nCall, VIDEO_AVATAR_IDENTIFIER } from "../lib/n8n";

  const [script, setScript] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const { push } = useToast();