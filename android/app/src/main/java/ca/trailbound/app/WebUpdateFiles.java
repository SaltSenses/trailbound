package ca.trailbound.app;
import java.io.*;import java.nio.file.*;import java.security.*;import java.util.*;import java.util.zip.*;
/** Downloads are verified as a complete release before any current file is changed. */
final class WebUpdateFiles {
 static final long MAX_ZIP=40L*1024*1024,MAX_EXPANDED=160L*1024*1024;
 static String hash(File file)throws Exception {MessageDigest md=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(file)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1)md.update(b,0,n);}StringBuilder s=new StringBuilder();for(byte b:md.digest())s.append(String.format(java.util.Locale.ROOT,"%02x",b&255));return s.toString();}
 static File child(File root,String path)throws IOException {if(path.isEmpty()||path.startsWith("/")||path.contains("\\")||path.contains(":")||Arrays.asList(path.split("/",-1)).contains(".."))throw new IOException("Unsafe update path");File f=new File(root,path);if(!f.getCanonicalPath().startsWith(root.getCanonicalPath()+File.separator))throw new IOException("Unsafe update path");return f;}
 static void unpack(File zip,File target,String expectedHash)throws Exception {
  if(zip.length()>MAX_ZIP||!hash(zip).equals(expectedHash))throw new IOException("Update checksum mismatch");
  if(!target.mkdir())throw new IOException("Update staging folder already exists");
  long total=0;int count=0;Set<String> names=new HashSet<>();
  try(ZipInputStream in=new ZipInputStream(new FileInputStream(zip))){ZipEntry e;byte[] b=new byte[32768];while((e=in.getNextEntry())!=null){if(++count>2000||!names.add(e.getName()))throw new IOException("Invalid update entries");File f=child(target,e.getName());if(e.isDirectory()){if(!f.mkdirs()&&!f.isDirectory())throw new IOException("Cannot create update folder");continue;}if(!f.getParentFile().mkdirs()&&!f.getParentFile().isDirectory())throw new IOException("Cannot create update folder");try(OutputStream out=new FileOutputStream(f)){int n;while((n=in.read(b))!=-1){total+=n;if(total>MAX_EXPANDED)throw new IOException("Update expands beyond limit");out.write(b,0,n);}}}}
  for(String name:new String[]{"index.html","app.js","core.js","release.json","data/canada.json","data/canada-routes.json.gz","data/trans-canada-trail.json.gz","vendor/maplibre-gl.js"})if(!child(target,name).isFile())throw new IOException("Incomplete update: "+name);
 }
 static void remove(File root)throws IOException {if(!root.exists())return;try(java.util.stream.Stream<Path> paths=Files.walk(root.toPath())){for(Path p:paths.sorted(Comparator.reverseOrder()).collect(java.util.stream.Collectors.toList()))Files.delete(p);}}
}
