package ca.trailbound.app;
import org.junit.Test;import static org.junit.Assert.*;
public class TrackPolicyTest {
 @Test public void rejectsStaleInaccurateAndInvalidFixes(){assertTrue(TrackPolicy.acceptable(51,-115,10,100000,100001));assertFalse(TrackPolicy.acceptable(51,-115,100,100000,100001));assertFalse(TrackPolicy.acceptable(51,-115,5,100000,140001));assertFalse(TrackPolicy.acceptable(Double.NaN,-115,5,100000,100001));assertFalse(TrackPolicy.acceptable(51,-115,5,150000,100001));}
 @Test public void preservesLongGaps(){assertFalse(TrackPolicy.gap(0,500000));assertTrue(TrackPolicy.gap(100000,300001));assertFalse(TrackPolicy.gap(100000,105000));}
}
