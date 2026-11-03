package ca.trailbound.app;
import org.junit.*;import org.junit.rules.TemporaryFolder;import static org.junit.Assert.*;import java.io.*;import java.util.zip.*;
public class WebUpdateFilesTest {
 @Rule public TemporaryFolder tmp=new TemporaryFolder();
 private File archive(String... names)throws Exception {File f=tmp.newFile();try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(f))){for(String name:names){z.putNextEntry(new ZipEntry(name));z.write("fixture".getBytes(java.nio.charset.StandardCharsets.UTF_8));z.closeEntry();}}return f;}
 @Test public void rejectsCorruptionBeforeCreatingStaging()throws Exception {File z=archive("index.html"),target=new File(tmp.getRoot(),"bad");assertThrows(IOException.class,()->WebUpdateFiles.unpack(z,target,"0".repeat(64)));assertFalse(target.exists());}
 @Test public void rejectsZipTraversal()throws Exception {File z=archive("../escaped"),target=new File(tmp.getRoot(),"unsafe");assertThrows(IOException.class,()->WebUpdateFiles.unpack(z,target,WebUpdateFiles.hash(z)));assertFalse(new File(tmp.getRoot(),"escaped").exists());}
 @Test public void rejectsIncompleteRelease()throws Exception {File z=archive("index.html"),target=new File(tmp.getRoot(),"partial");assertThrows(IOException.class,()->WebUpdateFiles.unpack(z,target,WebUpdateFiles.hash(z)));}
 @Test public void verifiesAndUnpacksCompleteRelease()throws Exception {File z=archive("index.html","app.js","core.js","release.json","data/canada.json","data/canada-routes.json.gz","data/trans-canada-trail.json.gz","vendor/maplibre-gl.js"),target=new File(tmp.getRoot(),"good");WebUpdateFiles.unpack(z,target,WebUpdateFiles.hash(z));assertTrue(new File(target,"data/trans-canada-trail.json.gz").isFile());}
}
