public void Foo()
{
    int x = 1;
#if MOCKCONDITION
    int foo = 2;
#else
    int bar = 2;
#endif
}
